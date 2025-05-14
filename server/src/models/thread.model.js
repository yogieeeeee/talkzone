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
    likeCount: {
      type: Number,
      default: 0
    },
    commentCount: {
      type: Number,
      default: 0
    }
  },
  {timestamps: true}
)

export default mongoose.model("thread", threadSchema)
