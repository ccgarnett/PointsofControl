import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { SkeletonPage } from './Skeleton';
import { Button } from '@mui/material';