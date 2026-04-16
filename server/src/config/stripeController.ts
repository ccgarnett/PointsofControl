import Stripe from 'stripe';

const stripeSK = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

const stripe = new Stripe(stripeSK, {
  apiVersion: '2026-03-25.dahlia',
});

export default stripe;

Stripe Controller
import type { AuthRequest } from './authMiddleware';
import { Request, Response } from 'express';
import stripe from './stripe';
import Course from './Course';
import User from './User';
import Purchase from './Purchase';

//incomplete -- need to find a way to do this properly so in a production environment, users cannot
//buy the same course over and over again
//mainly helps with checking if they have access to a course
export const getUserAccess = async (req: AuthRequest, res: Response)=>{
    try{
        if(!req.user){return res.status(401).json({message: 'unauthorized'});}
        const {userId, courseId} = req.params;

        const user = await User.findById(userId);

        if(!user){return res.status(404).json({message: "user not found"});}

        const hasPurchasedCourse = user.enrolledCourses.some((id)=>id.toString()===courseId);
        if(hasPurchasedCourse){return res.json({hasAccess: true});}

        return res.json({hasAccess: false});

    }
    catch(error){return res.status(500).json({ message: 'Server Error' });}
};

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
    try{
        const {courseId} = req.body as {courseId?: string};
        const identity = req.user;
        if(!identity){
            return res.status(401).json({message:'Unauthorized'});
        }
        if(!courseId){
            return res.status(400).json({message:'Course ID required'});
        }

        const user = await User.findById(identity.id).exec();

        if(!user){
            return res.status(404).json({message:'User not found'});
        }

        const course = await Course.findById(courseId).exec();
        if(!course){
            return res.status(404).json({message: 'Course not found'});
        }

        const session = await stripe.checkout.sessions.create({
            customer: user.stripeCustomerId,
            payment_method_types: ["card"],
            line_items: [{
                price_data:{
                    currency:'usd',
                    product_data:{
                        name: course.title,
                    },
                    unit_amount: Math.round(course.price*100)
                },
                quantity: 1
            }],
            mode:"payment",
            success_url: `${process.env.BASE_URL}/dashboard`,
            cancel_url: `${process.env.BASE_URL}/courses`,
            metadata:{
                courseId:course.id,
                userId: user.id
            }
        });

        return res.json({checkoutUrl: session.url})
    }catch(error){
        return res.status(500).json({message:'Server Error'});
    }
};
