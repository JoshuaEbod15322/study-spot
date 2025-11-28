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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./App.css";
import "./responsive.css";
import { Link } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data, error } = await signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setSuccess("Account created successfully! Redirecting...");
      }
    } catch (error) {
      if (error.message.includes("User already registered")) {
        setError("An account with this email already exists.");
      } else if (
        error.message.includes("Password should be at least 6 characters")
      ) {
        setError("Password must be at least 6 characters long.");
      } else if (error.message.includes("Invalid email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFacebookSignup = async () => {
    try {
      const { error } = await signInWithFacebook();
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-3 xs:p-4 sm:p-6">
      <Card className="w-full max-w-xs xs:max-w-sm sm:max-w-md shadow-xl rounded-lg sm:rounded-xl card-responsive">
        <CardHeader className="p-responsive">
          <CardTitle className="text-center text-xl xs:text-2xl sm:text-3xl font-bold tracking-tight text-title">
            StudySpot
          </CardTitle>
          <CardDescription className="text-center text-sm xs:text-base sm:text-md text-responsive">
            Create a new account to see places and study with your friends.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-3 xs:gap-4 sm:gap-4 p-responsive">
            {success && (
              <div className="bg-green-100 text-green-700 p-3 rounded-md text-xs xs:text-sm border border-green-300 break-word">
                {success}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm xs:text-base">
                Username
              </Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter your username"
                className="text-sm xs:text-base touch-friendly"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm xs:text-base">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter your email"
                className={`text-sm xs:text-base touch-friendly ${
                  error ? "border-red-500" : ""
                }`}
              />
              {error && (
                <div className="text-red-700 text-xs xs:text-sm break-word">
                  <div className="flex items-center">{error}</div>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-sm xs:text-base">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className={`text-sm xs:text-base pr-10 touch-friendly ${
                    error ? "border-red-500" : ""
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Create a password"
                  minLength="6"
                />
              </div>
              <p className="text-xs text-gray-500 break-word">
                Password must be at least 6 characters
              </p>
            </div>

            <div className="grid gap-2">
              <Label className="text-sm xs:text-base">Role</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-gray-700 text-sm xs:text-base touch-friendly"
                    disabled={loading}
                  >
                    {role === "library_staff"
                      ? "Library Staff"
                      : role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 modal-responsive">
                  <DropdownMenuLabel className="text-sm xs:text-base">
                    Select your role
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={role} onValueChange={setRole}>
                    <DropdownMenuRadioItem
                      value="student"
                      className="text-sm xs:text-base touch-friendly"
                    >
                      Student
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="teacher"
                      className="text-sm xs:text-base touch-friendly"
                    >
                      Teacher
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="library_staff"
                      className="text-sm xs:text-base touch-friendly"
                    >
                      Library Staff
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>

          <CardDescription className="m-[-4px] text-left px-7 xs:px-7 text-xs xs:text-sm break-word">
            Already have an account?
            <Button
              variant="link"
              disabled={loading}
              className="text-xs xs:text-sm touch-friendly"
            >
              <Link to="/login" className="reg">
                Sign In
              </Link>
            </Button>
          </CardDescription>

          <CardFooter className="flex flex-col space-y-3 xs:space-y-3 sm:space-y-3 p-responsive">
            <Button
              type="submit"
              className="w-full btn-responsive touch-friendly"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <div className="flex items-center w-full">
              <div className="flex-grow border-t border-gray-300" />
              <span className="mx-3 text-xs xs:text-sm text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-300" />
            </div>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 btn-responsive touch-friendly"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <FcGoogle className="w-4 h-4 xs:w-5 xs:h-5" />
              <span className="text-xs xs:text-sm">Continue with Google</span>
            </Button>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 btn-responsive touch-friendly"
              onClick={handleFacebookSignup}
              disabled={loading}
            >
              <FaFacebook className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" />
              <span className="text-xs xs:text-sm">Continue with Facebook</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default Signup;
