import React, { useState } from 'react';

/*const DailyChecklist: React.FC = () => {
  // Static framework as requested. Later, this can fetch from the DB.
  const [tasks, setTasks] = useState();

  const toggleTask = (id: number) => {};

  
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
};*/

//export default DailyChecklist;