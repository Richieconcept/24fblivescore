// models/League.js
import mongoose from 'mongoose';

const leagueSchema = new mongoose.Schema(
  {
    leagueId: { type: Number, unique: true, required: true },
    name: { type: String, required: true },
    country: { type: String },
    logo: { type: String },
    flag: { type: String },
    season: { type: Number, required: true },
  },
  { timestamps: true }
);

const League = mongoose.model('League', leagueSchema);
export default League;
