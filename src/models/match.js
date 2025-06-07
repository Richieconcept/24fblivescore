// models/Match.js
import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  fixtureId: { type: Number, unique: true, required: true }, // <- Use this!
  leagueId: Number,
  season: Number,
  date: Date,
  status: {
    long: String,
    short: String,
    elapsed: Number,
  },
  venue: {
  id: Number,
  name: String,
  city: String
},
  homeTeam: {
    id: Number,
    name: String,
    logo: String,
  },
  awayTeam: {
    id: Number,
    name: String,
    logo: String,
  },
  goals: {
    home: Number,
    away: Number,
  },
  score: {
    halftime: {
      home: Number,
      away: Number,
    },
    fulltime: {
      home: Number,
      away: Number,
    },
  },
}, { timestamps: true });

export default mongoose.model('Match', MatchSchema);
