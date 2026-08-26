import { Sequelize } from "sequelize";

const sequelize = new Sequelize('mindTrip','root','Ayush@10',{
    host:"localhost",
    dialect:"mysql",
})



export default sequelize;