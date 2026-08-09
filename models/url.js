const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    redirectUrl: {
      type: String,
      trim: true,
    },
    customAlias: {
      type: String,
      trim: true,
      sparse: true,
    },
    clicks: {
      type: Number,
      required: true,
      default: 0,
    },
    visitHistory: [
      {
        timestamp: {
          type: Number,
          default: () => Date.now(),
        },
        ip: {
          type: String,
          default: 'Unknown',
        },
        userAgent: {
          type: String,
          default: 'Unknown',
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure redirectUrl and originalUrl stay synced
urlSchema.pre('save', function () {
  if (this.originalUrl && !this.redirectUrl) {
    this.redirectUrl = this.originalUrl;
  } else if (this.redirectUrl && !this.originalUrl) {
    this.originalUrl = this.redirectUrl;
  }
});

const URL = mongoose.model('Url', urlSchema);

module.exports = URL;