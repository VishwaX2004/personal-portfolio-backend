import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    // Legacy single image field (kept for backward compatibility)
    image: {
      type: String,
      default: "",
    },

    // New: Multiple images from Supabase
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          // Validate each image URL is a non-empty string
          return v.every((url) => typeof url === "string" && url.trim().length > 0);
        },
        message: "All image URLs must be non-empty strings",
      },
    },

    // New: First image from images array (set automatically)
    coverImage: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "Web Development",
    },

    technologies: {
      type: [String],
      default: [],
    },

    githubUrl: {
      type: String,
      default: "",
    },

    liveUrl: {
      type: String,
      default: "",
    },

    // New: Dedicated project link field
    projectLink: {
      type: String,
      default: "",
    },

    featured: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "in-progress",
        "completed",
      ],
      default: "draft",
    },

  },
  {
    timestamps: true,
  }
);

// Pre-save hook to set coverImage automatically from images array
projectSchema.pre("save", function (next) {
  if (this.images && this.images.length > 0) {
    this.coverImage = this.images[0];
  }
  next();
});

// Pre-findByIdAndUpdate hook to set coverImage automatically
projectSchema.pre("findByIdAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.images && update.images.length > 0) {
    update.coverImage = update.images[0];
  }
  next();
});

export default mongoose.model(
  "Project",
  projectSchema
);