import { ProjectRepository } from './projectRepository';
import { UserRepository } from './userRepository';

test('ProjectRepository#getAllLinks', async () => {
  const projectRepository = new ProjectRepository();
  new UserRepository();
  const start = new Date().getTime();
  const source = await projectRepository.getDataSource('default');
  await projectRepository.getAllLinks(source, 100, 0);
  const end = new Date().getTime();
}, 90_000);
