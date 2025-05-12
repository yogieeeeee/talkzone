import mongooss from "mongoose"
const Schema = mongoose.Schema

const likeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    targetType: {
      type: String,
      enum: ["Thread", "Comment"],
      required: true
    },
    target: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType" // Referensi dinamis ke Article/Comment
    }
  },
  {timestamps: true}
)

export default mongoose.model("like", likeSchema)
