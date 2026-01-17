import { v4  as uuid4} from "uuid";

const USER_ID_KEY="user_id";
export interface UserSession {
    uid: string;
    isNew: boolean;
}
export function createOrGetUser():UserSession {
    const storedUid=localStorage.getItem(USER_ID_KEY);
    if (!storedUid)
    {
        const uid=uuid4();
        localStorage.setItem(USER_ID_KEY, uid);
        return{
            uid,
            isNew:true,
        };
    }
    return {
        uid:storedUid,
        isNew:false,
    };
}