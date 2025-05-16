import { SignJWT } from "jose";

const token = await new SignJWT({ id: user._id, role: user.role, email: user.email })
  .setProtectedHeader({ alg: "HS256" })
  .setExpirationTime("2h")
  .sign(secret);

cookies().set("auth_token", token, {
  httpOnly: true,
  path: "/",
  secure: process.env.NODE_ENV === "production",
});
