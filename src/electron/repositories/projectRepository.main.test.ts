import { ProjectRepository } from './projectRepository';
import { UserRepository } from './userRepository';

test('ProjectRepository#getAllLinks', async () => {
  const projectRepository = new ProjectRepository();
  new UserRepository();
  const source = await projectRepository.getDataSource('00000000-0000-4000-8000-000000000000');
  await projectRepository.getAllLinks(source, 100, 0);
}, 90_000);
