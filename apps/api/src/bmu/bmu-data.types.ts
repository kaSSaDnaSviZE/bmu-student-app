import { ScheduleItem, ScheduleScope } from '../schedule/resolve-schedule';
import { GradeSummary } from '../grades/grade-calculator';

export interface StudentProfile {
  studentId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  studentNo: string;
  program: string;
  programCode: string;
  group: string;
  faculty: string;
  enrollmentYear: number;
  locale: string;
}

export interface CourseSummary {
  id: string;
  code: string;
  title: string;
  titleEn: string;
  titleAz: string;
  titleRu: string;
  credits: number;
  semester: string;
  teacherName: string;
  groupCode: string;
}

export interface MaterialItem {
  id: string;
  title: string;
  type: string;
  url: string | null;
}

export interface AssignmentItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  title: string;
  description: string;
  deadline: string;
  maxScore: number;
  status: string;
  submittedAt: string | null;
  score: number | null;
}

export interface AssessmentItem {
  id: string;
  title: string;
  type: string;
  weight: number;
  maxScore: number;
  score: number | null;
  date: string | null;
  isFinal: boolean;
}

export interface CourseGrade {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  summary: GradeSummary;
  assessments: AssessmentItem[];
}

export interface AttendanceSummary {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percent: number | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  audience: string;
  courseCode: string | null;
  publishedAt: string;
}

export interface AcademicEventItem {
  id: string;
  title: string;
  titleEn: string;
  titleAz: string;
  titleRu: string;
  type: string;
  startsAt: string;
  endsAt: string | null;
  description: string | null;
}

export interface BuildingItem {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  nameAz: string;
  nameRu: string;
  kind: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  classrooms: { id: string; code: string; name: string; floor: number; capacity: number }[];
}

export interface ClassroomDetail {
  id: string;
  code: string;
  name: string;
  floor: number;
  capacity: number;
  building: BuildingItem;
}

export interface CampusHit {
  kind: 'building' | 'classroom';
  id: string;
  label: string;
  buildingCode: string;
  buildingName: string;
  room: string | null;
  floor: number | null;
  latitude: number | null;
  longitude: number | null;
  mapReady: false;
  note: string;
}

export interface EventItem {
  id: string;
  title: string;
  titleEn: string;
  titleAz: string;
  titleRu: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
  registeredCount: number;
  clubId: string | null;
  clubName: string | null;
  registered: boolean;
}

export interface ClubItem {
  id: string;
  name: string;
  nameEn: string;
  nameAz: string;
  nameRu: string;
  description: string;
  category: string;
  memberCount: number;
  joined: boolean;
  events: EventItem[];
}

export interface StudentIdCard {
  demoOnly: true;
  disclaimer: string;
  cardNumber: string;
  studentNo: string;
  firstName: string;
  lastName: string;
  program: string;
  qrPayload: string;
  issuedAt: string;
  expiresAt: string;
}

export interface LibraryBookItem {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  copies: number;
  available: number;
}

export interface DormitoryItem {
  id: string;
  name: string;
  gender: string;
  buildingCode: string;
  rooms: { id: string; number: string; capacity: number; occupied: number }[];
}

export interface SupportRequestItem {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface Dashboard {
  period: 'morning' | 'afternoon' | 'evening';
  profile: StudentProfile;
  nextClass: ScheduleItem | null;
  today: ScheduleItem[];
  deadlines: AssignmentItem[];
  attendance: AttendanceSummary[];
  announcements: AnnouncementItem[];
  unreadNotifications: number;
}

export interface CourseDetail extends CourseSummary {
  description: string | null;
  schedule: ScheduleItem[];
  materials: MaterialItem[];
  assignments: AssignmentItem[];
  grades: CourseGrade;
  attendance: AttendanceSummary;
  announcements: AnnouncementItem[];
}

export interface BMUDataProvider {
  getStudentProfile(studentId: string): Promise<StudentProfile | null>;
  getStudentSchedule(studentId: string, scope: ScheduleScope, now: Date): Promise<ScheduleItem[]>;
  getNextClass(studentId: string, now: Date): Promise<ScheduleItem | null>;
  getStudentCourses(studentId: string): Promise<CourseSummary[]>;
  getCourseForStudent(studentId: string, courseId: string): Promise<CourseDetail | null>;
  getCourseMaterials(studentId: string, courseId: string): Promise<MaterialItem[] | null>;
  getCourseAssignments(studentId: string, courseId: string): Promise<AssignmentItem[] | null>;
  getStudentGrades(studentId: string): Promise<CourseGrade[]>;
  getStudentAttendance(studentId: string, courseQuery?: string): Promise<AttendanceSummary[]>;
  getStudentDeadlines(studentId: string, now: Date): Promise<AssignmentItem[]>;
  getStudentAssignments(studentId: string): Promise<AssignmentItem[]>;
  submitAssignment(studentId: string, assignmentId: string, body: string, now: Date): Promise<AssignmentItem>;
  getStudentNotifications(userId: string): Promise<NotificationItem[]>;
  markNotificationRead(userId: string, notificationId: string, now: Date): Promise<NotificationItem | null>;
  getAnnouncements(studentId: string): Promise<AnnouncementItem[]>;
  getAcademicCalendar(now?: Date): Promise<AcademicEventItem[]>;
  getBuildings(): Promise<BuildingItem[]>;
  getClassroom(id: string): Promise<ClassroomDetail | null>;
  getCampusLocation(query: string): Promise<CampusHit[]>;
  getLibrary(): Promise<LibraryBookItem[]>;
  getDormitories(): Promise<DormitoryItem[]>;
  getEvents(userId: string): Promise<EventItem[]>;
  getEvent(userId: string, eventId: string): Promise<EventItem | null>;
  registerForEvent(userId: string, eventId: string): Promise<EventItem>;
  unregisterFromEvent(userId: string, eventId: string): Promise<EventItem>;
  getClubs(userId: string): Promise<ClubItem[]>;
  getClub(userId: string, clubId: string): Promise<ClubItem | null>;
  joinClub(userId: string, clubId: string): Promise<ClubItem>;
  leaveClub(userId: string, clubId: string): Promise<ClubItem>;
  getStudentIdCard(studentId: string): Promise<StudentIdCard | null>;
  getDashboard(studentId: string, userId: string, now: Date): Promise<Dashboard>;
  listSupportRequests(userId: string): Promise<SupportRequestItem[]>;
  createSupportRequest(
    userId: string,
    input: { category: string; subject: string; message: string },
  ): Promise<SupportRequestItem>;
}

export const BMU_DATA_PROVIDER = Symbol('BMU_DATA_PROVIDER');

export const MAP_NOTE =
  'Directory only. Live GPS is not connected. Coordinates are approximate campus points for a future map provider.';
