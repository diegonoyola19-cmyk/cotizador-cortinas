import React, { useState, useEffect } from "react";
import CotizadorCortinasWeb from "./CotizadorCortinasWeb";
import { LoginScreen } from "./components/LoginScreen";
import { supabase } from "./supabaseClient";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
         fetchProfile(session.user.id);
      } else {
         setProfile(null);
         setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
      try {
          // Consultar a la base de datos que acaban de correr en SQL
          const { data, error } = await supabase.from('perfiles').select('*').eq('id', userId).single();
          if (data) {
             setProfile(data);
          } else {
             // Si por alguna latencia la DB falla pero tiene usuario: fallback dummy
             setProfile({ id: userId, role: 'pending', vendedor_nombre: 'Asesor' });
          }
      } catch(e) {
          console.error("No se pudo fetchear perfil:", e);
      } finally {
          setLoading(false);
      }
  };

  if (loading) {
     return (
        <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-slate-50">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-semibold text-sm animate-pulse tracking-widest uppercase">Identificando llaves de seguridad...</p>
        </div>
     );
  }

  // 1. Barrera de Sesion sin llaves
  if (!session) {
     return <LoginScreen />;
  }

  // 2. Barrera de Privilegios (Aprobacion)
  if (profile?.role === 'pending') {
     return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-center text-slate-800">
            <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] max-w-sm border border-slate-100">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                   <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
                </div>
                <h1 className="text-2xl font-black mb-2 tracking-tight">Cuenta en Revisión</h1>
                <p className="text-slate-500 mb-8 text-sm font-medium">
                  Tu solicitud fue encapsulada exitosamente. Para que puedas comenzar a cotizar, el Administrador Corporativo debe certificar y aprobar tu acceso en el panel.
                </p>
                <button 
                  onClick={() => supabase.auth.signOut()} 
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors"
                >
                   Volver a la entrada (Cerrar)
                </button>
            </div>
        </div>
     );
  }

  // 3. Acceso Premium Autorizado
  return <CotizadorCortinasWeb authProfile={profile} />;
}