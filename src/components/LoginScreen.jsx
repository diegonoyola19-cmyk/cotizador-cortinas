import React, { useState } from "react";
import { Shield, ArrowRight, UserPlus, LogIn, Lock } from "lucide-react";
import { ButtonPrimary, ButtonSecondary, Campo } from "./ui/index.jsx";
import { supabase } from "../supabaseClient";
import { leerStorage } from "../utils/helpers";
import { STORAGE_KEYS } from "../utils/constants";

export function LoginScreen() {
  const [brand] = useState(() => leerStorage(STORAGE_KEYS.brand, { logo: "/logo-mec.jpg", colorPrimario: "#4f46e5" }));
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vendedorNombre, setVendedorNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMensaje("");

    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
           if (error.message.includes("Invalid login")) throw new Error("Correo o contraseña incorrectos.");
           throw error;
        }
        // El onAuthStateChange global detectara el logueo
      } else {
        if (!vendedorNombre.trim()) throw new Error("Por seguridad, requerimos tu nombre para ligarlo a tus cotizaciones.");
        if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              vendedor_nombre: vendedorNombre.trim(),
            }
          }
        });
        if (error) {
           if (error.message.includes("already registered")) throw new Error("Este correo ya está registrado.");
           throw error;
        }
        
        setMensaje("¡Solicitud enviada correctamente! Dile al administrador que apruebe tu cuenta para poder ingresar.");
        setModo("login");
        setPassword("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-800">
      
      {/* Fondo inmersivo */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
         <div className="absolute top-0 -right-4 w-72 h-72 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
         <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
            {brand?.logo ? (
              <img src={brand.logo} alt="Logo MEC" className="w-24 h-24 object-cover rounded-[1.3rem] shadow-[0_14px_28px_rgba(15,23,42,0.12)]" />
            ) : (
              <img src="/logo-mec.jpg" alt="Logo MEC" className="w-24 h-24 object-cover rounded-[1.3rem] shadow-[0_14px_28px_rgba(15,23,42,0.12)]" />
            )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-900">
          Bienvenido a MEC El Salvador
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-slate-500">
          {modo === "login" ? "Ingresa a tu cuenta autorizada" : "Solicita acceso al sistema comercial"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 transition-all">
        <div className="bg-white/80 py-8 px-4 shadow-[0_12px_44px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:px-10 border border-white/60 backdrop-blur-xl">
          
          {mensaje && (
             <div className="mb-6 bg-emerald-50 text-emerald-800 text-sm font-bold p-4 rounded-2xl border border-emerald-100 flex gap-2 shadow-sm">
                <Shield className="shrink-0" size={18} />
                <span>{mensaje}</span>
             </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {modo === "register" && (
                <div className="anim-fade-in">
                  <Campo 
                    label="Nombre Completo (Firma de Vendedor)" 
                    value={vendedorNombre} 
                    onChange={setVendedorNombre} 
                    inputProps={{ required: true, autoFocus: true, placeholder: "Ej. Ana Martínez" }} 
                  />
                </div>
            )}
            
            <Campo 
               label="Correo Electrónico" 
               type="email"
               value={email} 
               onChange={setEmail} 
               inputProps={{ required: true, placeholder: "usuario@empresa.com" }} 
            />
            
            <Campo 
               label="Contraseña Corporativa" 
               type="password"
               value={password} 
               onChange={setPassword} 
               inputProps={{ required: true, placeholder: "••••••••" }} 
            />

            {error && (
               <div className="text-red-600 text-xs font-bold px-2 flex gap-1 items-center bg-red-50 p-2 rounded-lg border border-red-100">
                 <Lock size={12}/> {error}
               </div>
            )}

            <div className="pt-2">
              <ButtonPrimary 
                color={brand?.colorPrimario || "#4f46e5"} 
                className="w-full !h-12 !text-base shadow-lg" 
                disabled={loading}
                icon={loading ? null : (modo === "login" ? <LogIn size={18}/> : <UserPlus size={18}/>)}
              >
                {loading ? "Procesando..." : (modo === "login" ? "Acceder al Dashboard" : "Enviar solicitud de cuenta")}
              </ButtonPrimary>
            </div>
          </form>

          <div className="mt-8 relative">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
             <div className="relative flex justify-center text-sm">
                 <span className="px-3 bg-white text-slate-500 font-semibold text-xs uppercase tracking-widest text-[#FFF]">Seguridad</span>
             </div>
          </div>

          <div className="mt-6 flex justify-center">
             <button
                type="button"
                onClick={() => {
                   setModo(modo === "login" ? "register" : "login");
                   setError("");
                   setMensaje("");
                }}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
             >
                {modo === "login" 
                   ? "¿Eres nuevo vendedor? Solicitar cuenta" 
                   : "Ya tengo una cuenta aprobada. Iniciar sesión."}
             </button>
          </div>
          
        </div>
      </div>
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
