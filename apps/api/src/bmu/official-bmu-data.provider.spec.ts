import { ServiceUnavailableException } from '@nestjs/common';
import { OfficialBMUDataProvider } from './official-bmu-data.provider';

describe('OfficialBMUDataProvider', () => {
  const provider = new OfficialBMUDataProvider();

  it('does not expose student records and has no database access', async () => {
    await expect(provider.getStudentGrades()).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(provider.getStudentAttendance()).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(provider.getCampusLocation()).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(Object.keys(provider)).not.toContain('prisma');
  });
});
