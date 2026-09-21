import { Request, Response } from "express";
import Trip from "../Service/Trip/Trip";

export const redirectUserInvite = async (
    req: Request,
    res: Response
) => {

    try {

        const base62Param = req.params.base62;

        if (!base62Param || Array.isArray(base62Param)) {
            return res.status(404).send("Invite not found");
        }
        
        const base62 = base62Param;

        if (!base62) {
            return res.status(404).send("Invite not found");
        }

        const tripInstance = new Trip();

        const response =
            await tripInstance.resolveUserInviteShortUrl(base62);

        if (!response.success || !response.data) {
            return res.redirect(
                302,
                `${process.env.FRONTEND_URL}/#/invite/invalid`
            );
        }

        const longUrl =
            `${process.env.FRONTEND_URL}/#/invite/${response.data.inviteURLID}`;

        return res.redirect(302, longUrl);

    } catch (error) {

        console.error("Error redirecting invite URL: ", error);

        return res.redirect(
            302,
            `${process.env.FRONTEND_URL}/#/invite/invalid`
        );
    }
};