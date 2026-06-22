const GarmentColor =
require("../model/GarmentColor");

exports.createColor = async (req,res)=>{
try{

const color = await GarmentColor.create(req.body);

res.status(201).json({
success:true,
data:color
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getColors = async(req,res)=>{
try{

const colors =
await GarmentColor.find();

res.json({
success:true,
count:colors.length,
data:colors
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getColorById = async(req,res)=>{
try{

const color =
await GarmentColor.findById(req.params.id);

res.json({
success:true,
data:color
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.updateColor = async(req,res)=>{
try{

const color =
await GarmentColor.findByIdAndUpdate(
req.params.id,
req.body,
{
new:true,
runValidators:true
}
);

res.json({
success:true,
data:color
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.deleteColor = async(req,res)=>{
try{

await GarmentColor.findByIdAndDelete(
req.params.id
);

res.json({
success:true,
message:"Color deleted"
});

}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};