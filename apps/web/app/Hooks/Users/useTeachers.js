import { RANKS } from "./constants";
import useUsersByRank from "./useUsersByRank";

export default function useTeachers() {
  return useUsersByRank(RANKS.TEACHER);
}
