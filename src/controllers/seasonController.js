const GarmentSeason =
require("../model/GarmentSeason");

exports.createSeason = async(req,res)=>{
try{
const season =
await GarmentSeason.create(req.body);

res.status(201).json({
success:true,
data:season
});
}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getSeasons = async(req,res)=>{
try{
const seasons =
await GarmentSeason.find();

res.json({
success:true,
data:seasons
});
}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.getSeasonById = async(req,res)=>{
try{
const season =
await GarmentSeason.findById(req.params.id);

res.json({
success:true,
data:season
});
}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.updateSeason = async(req,res)=>{
try{
const season =
await GarmentSeason.findByIdAndUpdate(
req.params.id,
req.body,
{new:true}
);

res.json({
success:true,
data:season
});
}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};

exports.deleteSeason = async(req,res)=>{
try{
await GarmentSeason.findByIdAndDelete(
req.params.id
);

res.json({
success:true,
message:"Season deleted"
});
}catch(error){
res.status(500).json({
success:false,
message:error.message
});
}
};