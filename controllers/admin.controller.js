import * as adminService from '../services/admin.service.js';
import { sendSuccess } from '../utils/response.util.js';
import asyncWrapper from '../utils/asyncWrapper.util.js';

// ─── Users ────────────────────────────────────────────────────────────────────

export const getAllUsers = asyncWrapper(async (req, res) => {
  const { page, limit, search, role, isActive } = req.query;
  const result = await adminService.getAllUsers({
    page,
    limit,
    search,
    role,
    // Convert string query param to boolean
    isActive: typeof isActive !== 'undefined' ? isActive === 'true' : undefined,
  });
  sendSuccess(res, { message: 'Users retrieved', data: result });
});

export const getUserById = asyncWrapper(async (req, res) => {
  const user = await adminService.getUserById(req.params.userId);
  sendSuccess(res, { data: user });
});

export const toggleUserStatus = asyncWrapper(async (req, res) => {
  const { isActive } = req.body;
  const user = await adminService.toggleUserStatus(req.params.userId, isActive);
  sendSuccess(res, {
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: user,
  });
});

// ─── User Prompt History (Admin view) ─────────────────────────────────────────

export const getUserPromptHistory = asyncWrapper(async (req, res) => {
  const { page, limit, toolMode, tone, search } = req.query;
  const result = await adminService.getUserPromptHistory(req.params.userId, {
    page,
    limit,
    toolMode,
    tone,
    search,
  });
  sendSuccess(res, { message: 'User prompt history retrieved', data: result });
});

export const getUserPromptVersions = asyncWrapper(async (req, res) => {
  const result = await adminService.getUserPromptVersions(req.params.promptId);
  sendSuccess(res, { data: result });
});

export const getUserAnalytics = asyncWrapper(async (req, res) => {
  const result = await adminService.getUserAnalyticsByAdmin(req.params.userId);
  sendSuccess(res, { data: result });
});
