import React, {useState, useEffect, useMemo} from 'react';
import { useAuth } from '../context/AuthContext';

type Task = {
  _id: string;
  user_id: string;
  dateKey: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

const localDateConversion = (localDate: Date) => {
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth()+1).padStart(2,'0');
  const day = String(localDate.getDay()).padStart(2,'0');
  return `${year}-${month}-${day}`;
};


const DailyChecklist: React.FC = () => {
  // Static framework as requested. Later, this can fetch from the DB.
  const {user} = useAuth();
  const user_id = user?.id ?? null;
  //const toggleTask = (id: number) => {};

  const dateKey = useMemo(() => localDateConversion(new Date()), []);
  const [task, setTasks] = useState<Task[]>([]);
  const [archived, setArchived] = useState<Task[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const [inputDesc, setInputDesc] = useState('');
  const [status, setStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edit_id, setEdit_id] = useState<string | null>(null);
  const [editedDesc, setEditedDesc] = useState(''); 

  const createItem = async () => {
  };

  
  /*return (
    <div className="checklist-container">
      <h3>Daily Checklist</h3>
      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className="task-item">
            <input 
              type="checkbox" 
              checked={task.completed} 
              onChange={() => toggleTask(task.id)}
            />
            <span className={task.completed ? 'done' : ''}>
              {task.text}
            </span>
          </div>
        ))}
      </div>
    </div>
    
  );*/
};

export default DailyChecklist;