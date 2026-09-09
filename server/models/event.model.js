import mongoose from "mongoose"


const eventSchema = new mongoose.Schema({
  event: {
    type: String,
    required:true,
    unique: true
  },
  description:  {
    type: String
 
  },
  type:{
    type:String,
    required:true,
    enum:["Individual", "Team"]

  },
  venue:{
    type:String
    
  },
  time:{
    type:String
  },
  limit:{
    type:Number
  },
  halt:{
    type:Number,
    default:0
  }
});



export default mongoose.model("Events",eventSchema)