import { useDispatch } from "react-redux";
import { getUserData } from "../https";
import { useEffect, useState } from "react";
import { removeUser, setUser } from "../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";

const useLoadData = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Backend uses httpOnly cookies for authentication
        // Try to get user data - if successful, user is authenticated
        const { data } = await getUserData();
        console.log('User data fetched successfully:', data);
        const { _id, name, email, phone, role } = data.data;
        dispatch(setUser({ _id, name, email, phone, role }));
      } catch (error) {
        console.log('Error in useLoadData:', error);
        
        // Only logout if it's actually an authentication error
        if (error.response && error.response.status === 401) {
          console.log('401 error in useLoadData - user not authenticated');
          dispatch(removeUser());
          navigate("/auth");
        } else {
          // For other errors, just log them but don't logout
          console.log('Non-auth error in useLoadData, not logging out');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [dispatch, navigate]);

  return isLoading;
};

export default useLoadData;
