import React, {useState} from 'react';
import {useAuth} from '../context/AuthContext';

type Props = {courseId: string};

const PurchaseButton: React.FC<Props> = ({courseId}) => {
    return (
        <div>PurchaseButton</div>
    )
}
export default PurchaseButton;
