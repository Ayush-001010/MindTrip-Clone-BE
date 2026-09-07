import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User";


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_CALLBACK_URL
) {
    throw new Error("Google OAuth environment variables are not defined");
}

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const googleId = profile.id;

                const email = profile.emails?.[0]?.value;

                if (!email) {
                    return done(
                        new Error("Google account email is not available"),
                        false
                    );
                }

                const name = profile.displayName;

                // 1. Check if this Google account already exists
                let user = await User.findOne({
                    where: { googleId },
                });

                if (user) {
                    return done(null, user);
                }

                // 2. Check if an account with this email already exists
                user = await User.findOne({
                    where: { email },
                });

                if (user) {
                    // Link existing account with Google
                    user.googleId = googleId;

                    await user.save();

                    return done(null, user);
                }

                // 3. Create a new Google user
                user = await User.create({
                    name,
                    email,
                    password: null,
                    googleId,
                });

                return done(null, user);

            } catch (error) {
                return done(error, false);
            }
        }
    )
);

export default passport;