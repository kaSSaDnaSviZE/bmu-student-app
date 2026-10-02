import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { BMUDataProvider } from './bmu-data.types';

/**
 * Placeholder for a future official BMU integration.
 * It has no database client and does not return fictional academic records
 * disguised as live university data.
 */
@Injectable()
export class OfficialBMUDataProvider implements BMUDataProvider {
  private unavailable(): Promise<never> {
    return Promise.reject(
      new ServiceUnavailableException(
        'The official BMU data provider is not configured. Set BMU_DATA_PROVIDER=mock for the local demo dataset.',
      ),
    );
  }

  getStudentProfile() { return this.unavailable(); }
  getStudentSchedule() { return this.unavailable(); }
  getNextClass() { return this.unavailable(); }
  getStudentCourses() { return this.unavailable(); }
  getCourseForStudent() { return this.unavailable(); }
  getCourseMaterials() { return this.unavailable(); }
  getCourseAssignments() { return this.unavailable(); }
  getStudentGrades() { return this.unavailable(); }
  getStudentAttendance() { return this.unavailable(); }
  getStudentDeadlines() { return this.unavailable(); }
  getStudentAssignments() { return this.unavailable(); }
  submitAssignment() { return this.unavailable(); }
  getStudentNotifications() { return this.unavailable(); }
  markNotificationRead() { return this.unavailable(); }
  getAnnouncements() { return this.unavailable(); }
  getAcademicCalendar() { return this.unavailable(); }
  getBuildings() { return this.unavailable(); }
  getClassroom() { return this.unavailable(); }
  getCampusLocation() { return this.unavailable(); }
  getLibrary() { return this.unavailable(); }
  getDormitories() { return this.unavailable(); }
  getEvents() { return this.unavailable(); }
  getEvent() { return this.unavailable(); }
  registerForEvent() { return this.unavailable(); }
  unregisterFromEvent() { return this.unavailable(); }
  getClubs() { return this.unavailable(); }
  getClub() { return this.unavailable(); }
  joinClub() { return this.unavailable(); }
  leaveClub() { return this.unavailable(); }
  getStudentIdCard() { return this.unavailable(); }
  getDashboard() { return this.unavailable(); }
  listSupportRequests() { return this.unavailable(); }
  createSupportRequest() { return this.unavailable(); }
}
