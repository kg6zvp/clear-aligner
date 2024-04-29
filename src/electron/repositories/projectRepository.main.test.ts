import { ProjectRepository } from './projectRepository';
import { UserRepository } from './userRepository';

test('ProjectRepository#getAllLinks', async () => {
  const projectRepository = new ProjectRepository();
  const _ = new UserRepository();
  const start = new Date().getTime();
  const source = await projectRepository.getDataSource('default');
  const links = await projectRepository.getAllLinks(source, 100, 0);
  const end = new Date().getTime();
  console.log('time elapsed', end-start);
}, 90_000);
