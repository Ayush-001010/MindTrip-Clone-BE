import { Request, Response } from 'express';
import {  validationResult } from 'express-validator';
import APIResponseInterface from '../Interface/ResponseInterface/APIResponseInterface';
import Trip from '../Service/Trip/Trip';

export const exploreTrip = async  (req : Request, res: Response) => {
    try {
        console.log("exploreTrip called");
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            const responseObj : APIResponseInterface<null> = {
                success: false,
                error: errors.array().map((error) => error.msg)
            }
            return res.status(400).send(responseObj);
        } else {
            const tripInstance = new Trip();
            const {pageNo} = req.query;
            const responseObj =  await tripInstance.exploreTrip(Number(pageNo));
            return res.status(200).send(responseObj);
        }
    } catch (error) {}
}