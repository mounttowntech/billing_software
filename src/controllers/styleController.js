const GarmentStyle =
require("../model/GarmentStyle");

exports.createStyle = async(req,res)=>{
try{
const style =
await GarmentStyle.create(req.body);

res.status(201).json({
success:true,
data:style
});
}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getStyles = async(req,res)=>{
try{
const styles =
await GarmentStyle.find();

res.json({
success:true,
data:styles
});
}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getStyleById = async(req,res)=>{
try{
const style =
await GarmentStyle.findById(req.params.id);

res.json({
success:true,
data:style
});
}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.updateStyle = async(req,res)=>{
try{
const style =
await GarmentStyle.findByIdAndUpdate(
req.params.id,
req.body,
{
new:true
}
);

res.json({
success:true,
data:style
});
}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.deleteStyle = async(req,res)=>{
try{
await GarmentStyle.findByIdAndDelete(
req.params.id
);

res.json({
success:true,
message:"Style deleted"
});
}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};