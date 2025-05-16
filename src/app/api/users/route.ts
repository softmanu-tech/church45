import dbC from "@/lib/mongodb";

import {User} from "@/lib/models/User";

import {NextResponse} from "next/server";
import bcrypt from "bcrypt";

export async  function  POST(req: Request) {
    try{
        await connectionToDatabase();
        const {email, password} = await req.json()

        const user = await User.findOne({ email });

        //validate input
        if(!email || !password){
            return NextResponse.json({ message: 'Email or password', status: 401 });
        }

        if(!user){
            return NextResponse.json({ message: 'Invalid email or password', status: 401 });
        }

        //check password
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return NextResponse.json({ message: 'Invalid password', status: 401 });
        }
        //success
        return NextResponse.json({ message: "Login successful", userId: user._id}, {status: 200})


    }catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Something went wrong"  }, {status: 500});
    }
}