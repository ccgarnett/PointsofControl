import React, { useEffect } from 'react';
import Sidebar from './Sidebar';

const paragraphs = [
  `My name is Jordan and I created this business to help others make it through the long & hard process of Entrepreneurship. I was raised in Baltimore, Maryland and am currently 20 years old. For the majority of my life, self-doubt and insecurities ruled me. My default programming was to believe I'd never have the things I would dream about, because dreams aren't real right? I ended up never putting more than the bare minimum into things such as school, as I never had the opportunity to work and obtain something that mattered to me yet.`,
  `When I was 16 though, I had been given access to the gym, and for all my life I had always dreamed of liking my body and being muscular. I took this opportunity & ran, creating a product approaching my dream physique within 3 years & going from 120lb to 170lb.`,
  `The next catalyst that changed my life was when I was 18 and had been serving at restaurants for almost a year. I had started to realize my mind was capable of so much more than taking the orders of others. It was then that I decided to learn the skill of trading and within 4 months of endless studying and practice, I was no longer dependent on serving for money anymore.`,
  `My current catalyst is going on as I write this short story about myself. I have learned so much about the online business world, the skills of discipline, and mental health since I became a Trader. These hard lessons have made it possible for me to achieve my next dream, teaching like-minded achievers how to succeed.`,
  `Although I was mainly a Trader before this business, I feel that qualifies me to teach the skills we provide to Entrepreneurs even more. When you do not have control of aspects in your life in trading, you don't just stagnate like you would with a business, you actually lose money (very quickly at times too). Luckily though, when you take control of your mind and put in the work, you can make unimaginable progress towards your dreams like I have. I hope you're as excited to work with me as I am to work with you.`,
];

const About: React.FC = () => {
  useEffect(() => {
    document.title = 'Points of Control — About';
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ overflowY: 'auto' }}>
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>About</h2>
        </header>

        <div className="about-wrapper">
          <div className="about-card">
            <div className="about-avatar">JD</div>
            <div className="about-header-text">
              <h2 className="about-name">Jordan Dahl</h2>
              <span className="about-title">Founder &amp; CEO</span>
            </div>
          </div>

          <div className="about-story">
            <h3 className="about-story-heading">Meet the Founder</h3>
            {paragraphs.map((p, i) => (
              <p key={i} className="about-paragraph">{p}</p>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
