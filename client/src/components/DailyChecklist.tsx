import React, { useState } from 'react';

const DailyChecklist: React.FC = () => {
  // Static framework as requested. Later, this can fetch from the DB.
  const [tasks, setTasks] = useState([
    { id: 1, text: "Watch Module 1 Video", completed: false },
    { id: 2, text: "Read 'Story of Jordan'", completed: true },
    { id: 3, text: "Complete Quiz 1", completed: false }
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
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
  );
};

export default DailyChecklist;