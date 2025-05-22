MemberSchema.pre<IMember>("save", async function (next) {
    if (!this.isModified("password")) return next();
  
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      // Check if error is an instance of Error
      if (error instanceof Error) {
        next(error); // Pass the error to the next middleware
      } else {
        next(new Error("Unknown error during password hashing")); // Handle unknown error
      }
    }
  });
  