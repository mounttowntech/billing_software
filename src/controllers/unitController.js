const Unit = require("../model/Unit");

exports.createUnit = async (req, res) => {
  try {
    const unit = await Unit.create(req.body);

    res.status(201).json({
      success: true,
      data: unit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUnits = async (req, res) => {
  try {
    const units = await Unit.find();

    res.json({
      success: true,
      data: units,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);

    res.json({
      success: true,
      data: unit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({
      success: true,
      data: unit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    await Unit.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Unit deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
