MemberSchema.pre<IMember>("save", async function (next) {
    if (!this.isModified("password")) return next()
  
    try {
      const salt = await bcrypt.genSalt(10)
      this.password = await bcrypt.hash(this.password, salt)
      next()
    } catch (error) {
      // Cast error to 'CallbackError' or handle unknown error safely
      if (error instanceof Error) {
        next(error)
      } else {
        
      }
    }
  })
  