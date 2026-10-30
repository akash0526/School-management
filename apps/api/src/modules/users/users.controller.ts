// =============================================================================
// @sms/api/src/modules/users/users.controller.ts - Admin HTTP controllers
// =============================================================================
import { Request, Response } from "express";
import * as usersService from "./users.service";

type Req = Request<Record<string, string>, {}, any, any>;

export const usersController = {
  // --- School ---
  createSchool: async (req: Req, res: Response) => {
    const school = await usersService.createSchool(req.body);
    return res.status(201).json({ success: true, data: school });
  },
  getSchools: async (req: Req, res: Response) => {
    const schools = await usersService.getSchools();
    return res.json({ success: true, data: schools });
  },

  // --- Classes ---
  createClass: async (req: Req, res: Response) => {
    const { schoolId } = req.params;
    const cls = await usersService.createClass(schoolId, req.body);
    return res.status(201).json({ success: true, data: cls });
  },
  getClasses: async (req: Req, res: Response) => {
    const { schoolId } = req.params;
    const classes = await usersService.getClasses(schoolId);
    return res.json({ success: true, data: classes });
  },

  // --- Subjects ---
  createSubject: async (req: Req, res: Response) => {
    const subject = await usersService.createSubject(req.body.name);
    return res.status(201).json({ success: true, data: subject });
  },
  getSubjects: async (req: Req, res: Response) => {
    const subjects = await usersService.getSubjects();
    return res.json({ success: true, data: subjects });
  },

  // --- Teachers ---
  createTeacher: async (req: Req, res: Response) => {
    const { schoolId } = req.params;
    const result = await usersService.createTeacher(schoolId, req.body);
    return res.status(201).json({ success: true, data: result });
  },
  getTeachers: async (req: Req, res: Response) => {
    const { schoolId } = req.params;
    const teachers = await usersService.getTeachers(schoolId);
    return res.json({ success: true, data: teachers });
  },

  // --- Students ---
  createStudent: async (req: Req, res: Response) => {
    const { schoolId } = req.params;
    const student = await usersService.createStudent(schoolId, req.body);
    return res.status(201).json({ success: true, data: student });
  },
  getStudents: async (req: Req, res: Response) => {
    const { schoolId } = req.params;
    const { classId } = req.query;
    const students = await usersService.getStudents(schoolId, classId as string);
    return res.json({ success: true, data: students });
  },

  // --- Parents ---
  createParent: async (req: Req, res: Response) => {
    const { schoolId } = req.params;
    const result = await usersService.createParent(schoolId, req.body);
    return res.status(201).json({ success: true, data: result });
  },
  getParents: async (req: Req, res: Response) => {
    const { schoolId } = req.params;
    const parents = await usersService.getParents(schoolId);
    return res.json({ success: true, data: parents });
  },

  // --- Users ---
  getUsers: async (req: Req, res: Response) => {
    const { schoolId } = req.params;
    const users = await usersService.getUsers(schoolId);
    return res.json({ success: true, data: users });
  },
  deactivateUser: async (req: Req, res: Response) => {
    const { schoolId } = req.params;
    const { userId } = req.params;
    await usersService.deactivateUser(userId, schoolId);
    return res.json({ success: true, data: { message: "User deactivated" } });
  },
};

export default usersController;
