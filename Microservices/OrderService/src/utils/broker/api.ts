import axios from "axios";
import { AuthorizeError, NotFoundError } from "../error";

const AUTH_SERVICE_BASE_URL =
  process.env.AUTH_SERVICE_BASE_URL || "http://localhost:9000";

export const ValidateUser = async (token: string) => {
  try {
    console.log("ValidateUser called", token);
    const response = await axios.get(`${AUTH_SERVICE_BASE_URL}/auth/validate`, {
      headers: {
        Authorization: token,
      },
    });

    console.log("response", response.data);

    if (response.status !== 200) {
      throw new AuthorizeError("user not authorised");
    }
    // return { email: "jashpatel", id: 1 } as User;
  } catch (error) {
    throw new AuthorizeError("user not authorised");
  }
};
