import Task from './Task';

describe('Task model', () => {
  it('exports a mongoose model named Task', () => {
    expect((Task as any).modelName).toBe('Task');
  });
});

