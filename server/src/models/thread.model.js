import mongoose from "mongoose"
const Schema = mongoose.Schema

const threadSchema = new Schema(
  {
    content: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: null
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        select: false
      }
    ],
    views: {
      type: Number,
      default: 0
    }
  },
  {timestamps: true}
)

export default mongoose.model("blog", threadSchema)
