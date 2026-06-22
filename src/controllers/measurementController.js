const GarmentMeasurement = require("../model/GarmentMeasurement");

exports.createMeasurement = async (req, res) => {
  try {
    const measurement = await GarmentMeasurement.create(req.body);

    res.status(201).json({
      success: true,
      data: measurement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMeasurements = async (req, res) => {
  try {
    const measurements = await GarmentMeasurement.find().populate(
      "customer",
      "customerName phone",
    );

    res.json({
      success: true,
      data: measurements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMeasurementById = async (req, res) => {
  try {
    const measurement = await GarmentMeasurement.findById(req.params.id);

    res.json({
      success: true,
      data: measurement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateMeasurement = async (req, res) => {
  try {
    const measurement = await GarmentMeasurement.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );

    res.json({
      success: true,
      data: measurement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteMeasurement = async (req, res) => {
  try {
    await GarmentMeasurement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Measurement deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
