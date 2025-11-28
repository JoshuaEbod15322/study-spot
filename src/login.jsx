import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import educationImg from "/books.svg";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import "./responsive.css";
import "./App.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await signIn({ email, password });
      if (error) throw error;
    } catch (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError(
          "Sorry, your password was incorrect. Please double check your password."
        );
      } else if (error.message.includes("Email not confirmed")) {
        setError("Please verify your email address before logging in.");
      } else if (error.message.includes("User not found")) {
        setError(
          "No account found with this email address. Please sign up first."
        );
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const { error } = await signInWithFacebook();
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center md:justify-end p-3 xs:p-4 sm:p-6">
        <div className="login-image hidden md:block md:w-1/2 lg:w-1/2 xl:w-1/2">
          <img
            src={educationImg}
            alt="Login Visual"
            className="img-responsive"
            loading="lazy"
          />
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center px-3 xs:px-4">
          <Card className="w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-md min-h-[400px] xs:min-h-[450px] sm:min-h-[500px] mt-0 md:mt-0 py-4 xs:py-5 sm:py-6 card-responsive">
            <CardHeader className="p-responsive">
              <CardTitle className="text-center text-xl xs:text-2xl sm:text-3xl login text-title">
                Login
              </CardTitle>
              <CardDescription className="text-center text-sm xs:text-base text-responsive">
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>

            <CardContent className="p-responsive">
              <form onSubmit={handleSubmit} className="form-responsive">
                <div className="flex flex-col gap-4 xs:gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm xs:text-base">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={handleEmailChange}
                      disabled={loading}
                      className={`text-sm xs:text-base touch-friendly ${
                        error ? "border-red-500" : ""
                      }`}
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label
                        htmlFor="password"
                        className="text-sm xs:text-base"
                      >
                        Password
                      </Label>
                      <a
                        href="#"
                        className="ml-auto inline-block text-xs xs:text-sm underline-offset-4 hover:underline touch-friendly"
                      >
                        Forgot your password?
                      </a>
                    </div>

                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        className={`text-sm xs:text-base pr-10 touch-friendly ${
                          error ? "border-red-500" : ""
                        }`}
                        value={password}
                        onChange={handlePasswordChange}
                        disabled={loading}
                      />
                    </div>
                    {error && (
                      <div className="text-red-700 text-xs xs:text-sm break-word">
                        <div className="flex items-center">{error}</div>
                      </div>
                    )}
                  </div>
                </div>

                <CardDescription className="text-left mt-4 text-xs xs:text-sm break-word">
                  You don't have an account?
                  <Button
                    variant="link"
                    disabled={loading}
                    className="text-xs xs:text-sm touch-friendly"
                  >
                    <Link to="/signup" className="reg">
                      Sign Up
                    </Link>
                  </Button>
                </CardDescription>

                <Button
                  type="submit"
                  className="w-full btn-responsive touch-friendly"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Login"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex-col gap-2 p-responsive">
              <div className="flex items-center w-full mt-[-15px]">
                <hr className="flex-grow border-t border-gray-300" />
                <span className="mx-3 text-gray-500 text-xs xs:text-sm">
                  OR
                </span>
                <hr className="flex-grow border-t border-gray-300" />
              </div>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 btn-responsive touch-friendly"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <FcGoogle className="w-4 h-4 xs:w-5 xs:h-5" />
                <span className="text-xs xs:text-sm">Login with Google</span>
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 mt-2 btn-responsive touch-friendly"
                onClick={handleFacebookLogin}
                disabled={loading}
              >
                <FaFacebook className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" />
                <span className="text-xs xs:text-sm">Login with Facebook</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
