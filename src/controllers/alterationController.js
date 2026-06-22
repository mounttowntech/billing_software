const GarmentAlteration = require("../model/GarmentAlteration");

exports.createAlteration = async (req, res) => {
  try {
    const alteration = await GarmentAlteration.create(req.body);

    res.status(201).json({
      success: true,
      data: alteration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAlterations = async (req, res) => {
  try {
    const alterations = await GarmentAlteration.find()
      .populate("customer", "customerName phone")
      .populate("invoice", "invoiceNo");

    res.json({
      success: true,
      data: alterations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAlterationById = async (req, res) => {
  try {
    const alteration = await GarmentAlteration.findById(req.params.id)
      .populate("customer", "customerName phone")
      .populate("invoice", "invoiceNo");

    res.json({
      success: true,
      data: alteration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateAlteration = async (req, res) => {
  try {
    const alteration = await GarmentAlteration.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );

    res.json({
      success: true,
      data: alteration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteAlteration = async (req, res) => {
  try {
    await GarmentAlteration.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Alteration deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
