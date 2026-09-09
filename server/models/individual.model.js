import mongoose from "mongoose";


const individualParticipation = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true
    },
   events:{
    type: [String]
   }
   
});





export default mongoose.model(
  "individualEvents",
  individualParticipation,
  "individualEvents"
);