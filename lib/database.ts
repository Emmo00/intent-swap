import mongoose, { Schema, Document, Model } from 'mongoose'
import type { ChatMessage } from '@/types'
import "dotenv/config";

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase'

// Define the ChatMessage schema inline to avoid type complexity
const ChatMessageSchema = new Schema({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, { _id: false })

// ---------- Swap Transaction ----------

export interface ISwapTransaction extends Document {
  userId: string
  txHash: string
  sellToken: string
  sellSymbol: string
  sellAmount: string
  buyToken: string
  buySymbol: string
  buyAmount: string
  status: 'confirmed' | 'reverted' | 'pending'
  createdAt: Date
}

const SwapTransactionSchema = new Schema<ISwapTransaction>({
  userId: { type: String, required: true, index: true },
  txHash: { type: String, required: true, unique: true },
  sellToken: { type: String, required: true },
  sellSymbol: { type: String, required: true },
  sellAmount: { type: String, required: true },
  buyToken: { type: String, required: true },
  buySymbol: { type: String, required: true },
  buyAmount: { type: String, required: true },
  status: { type: String, enum: ['confirmed', 'reverted', 'pending'], default: 'confirmed' },
  createdAt: { type: Date, default: Date.now },
})

const SwapTransaction: Model<ISwapTransaction> =
  mongoose.models.SwapTransaction ||
  mongoose.model<ISwapTransaction>('SwapTransaction', SwapTransactionSchema)

// Define the ChatSession interface extending Mongoose Document
export interface IChatSession extends Document {
  sessionId: string
  userId?: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

// Define the ChatSession schema
const ChatSessionSchema = new Schema<IChatSession>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: false
  },
  messages: [ChatMessageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Update the updatedAt field before saving
ChatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Create the model
const ChatSession: Model<IChatSession> = mongoose.models.ChatSession || 
  mongoose.model<IChatSession>('ChatSession', ChatSessionSchema)

// Connection management
let isConnected = false

export async function connectToDatabase(): Promise<void> {
  if (isConnected) {
    return
  }

  try {
    const options = {
      bufferCommands: true, // Enable buffering to allow operations before connection is complete
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    await mongoose.connect(uri, options)
    isConnected = true
    
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error)
      isConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected')
      isConnected = false
    })

    console.log('✅ Connected to MongoDB via Mongoose')
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    throw new Error('Database connection failed')
  }
}

// Chat database operations class
export class ChatDatabase {
  constructor() {
    // Ensure connection on instantiation
    if (!isConnected) {
      connectToDatabase()
    }
  }

  async getSession(sessionId: string): Promise<IChatSession | null> {
    try {
      await connectToDatabase()
      return await ChatSession.findOne({ sessionId }).exec()
    } catch (error) {
      console.error('Error getting session:', error)
      throw error
    }
  }

  async createSession(sessionId: string, userId?: string): Promise<IChatSession> {
    try {
      await connectToDatabase()
      
      const session = new ChatSession({
        sessionId,
        userId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return await session.save()
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }

  async addMessage(sessionId: string, message: ChatMessage): Promise<IChatSession | null> {
    try {
      await connectToDatabase()
      
      const session = await ChatSession.findOneAndUpdate(
        { sessionId },
        { 
          $push: { messages: message },
          $set: { updatedAt: new Date() }
        },
        { new: true, runValidators: true }
      ).exec()

      return session
    } catch (error) {
      console.error('Error adding message:', error)
      throw error
    }
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      await connectToDatabase()
      
      const session = await ChatSession.findOne({ sessionId }).exec()
      return session?.messages || []
    } catch (error) {
      console.error('Error getting messages:', error)
      throw error
    }
  }

  async updateSession(sessionId: string, messages: ChatMessage[]): Promise<IChatSession | null> {
    try {
      await connectToDatabase()
      
      const session = await ChatSession.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            messages,
            updatedAt: new Date()
          }
        },
        { new: true, runValidators: true }
      ).exec()

      return session
    } catch (error) {
      console.error('Error updating session:', error)
      throw error
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await connectToDatabase()
      
      const result = await ChatSession.deleteOne({ sessionId }).exec()
      return result.deletedCount > 0
    } catch (error) {
      console.error('Error deleting session:', error)
      throw error
    }
  }

  async getAllSessions(userId?: string): Promise<IChatSession[]> {
    try {
      await connectToDatabase()
      
      const filter = userId ? { userId } : {}
      return await ChatSession.find(filter)
        .sort({ updatedAt: -1 })
        .exec()
    } catch (error) {
      console.error('Error getting all sessions:', error)
      throw error
    }
  }

  async getSessionStats(sessionId: string): Promise<{
    messageCount: number,
    userMessages: number,
    modelMessages: number,
    lastActivity: Date
  } | null> {
    try {
      await connectToDatabase()
      
      const session = await ChatSession.findOne({ sessionId }).exec()
      if (!session) return null

      const messageCount = session.messages.length
      const userMessages = session.messages.filter(m => m.role === 'user').length
      const modelMessages = session.messages.filter(m => m.role === 'model').length

      return {
        messageCount,
        userMessages,
        modelMessages,
        lastActivity: session.updatedAt
      }
    } catch (error) {
      console.error('Error getting session stats:', error)
      throw error
    }
  }
}

// Export singleton instance
export const chatDatabase = new ChatDatabase()

// ---------- Swap Transaction Database ----------

export class SwapTransactionDatabase {
  constructor() {
    if (!isConnected) {
      connectToDatabase()
    }
  }

  async create(data: {
    userId: string
    txHash: string
    sellToken: string
    sellSymbol: string
    sellAmount: string
    buyToken: string
    buySymbol: string
    buyAmount: string
    status?: string
  }): Promise<ISwapTransaction> {
    await connectToDatabase()
    const tx = new SwapTransaction(data)
    return tx.save()
  }

  async getByUser(userId: string, limit = 50): Promise<ISwapTransaction[]> {
    await connectToDatabase()
    return SwapTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()
  }

  async getByHash(txHash: string): Promise<ISwapTransaction | null> {
    await connectToDatabase()
    return SwapTransaction.findOne({ txHash }).exec()
  }
}

export const swapTransactionDatabase = new SwapTransactionDatabase()

// Export models for advanced usage
export { ChatSession, SwapTransaction }
