const RolePermission = require("../model/RolePermission");

exports.createRolePermission = async (req, res) => {
  try {
    const data = await RolePermission.create(req.body);
    res.status(201).json({ success: true, message: "RolePermission created", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRolePermissions = async (req, res) => {
  try {
    const data = await RolePermission.find(req.query).sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRolePermissionById = async (req, res) => {
  try {
    const data = await RolePermission.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "RolePermission not found" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRolePermission = async (req, res) => {
  try {
    const data = await RolePermission.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) return res.status(404).json({ success: false, message: "RolePermission not found" });
    res.json({ success: true, message: "RolePermission updated", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRolePermission = async (req, res) => {
  try {
    const data = await RolePermission.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "RolePermission not found" });
    res.json({ success: true, message: "RolePermission deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
