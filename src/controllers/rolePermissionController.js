const RolePermission = require("../model/RolePermission");

exports.createRole = async (req, res) => {
  try {
    const role = await RolePermission.create(req.body);

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await RolePermission.find();

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const role = await RolePermission.findById(req.params.id);

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const role = await RolePermission.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    await RolePermission.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Role deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
