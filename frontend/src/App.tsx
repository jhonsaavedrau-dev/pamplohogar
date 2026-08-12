import { Route, Routes } from 'react-router-dom';
import { Encabezado } from './components/Encabezado';
import { PiePagina } from './components/PiePagina';
import { RutaProtegida } from './components/RutaProtegida';
import { Buscar } from './pages/Buscar';
import { DetalleInmueble } from './pages/DetalleInmueble';
import { Entrar } from './pages/Entrar';
import { Registro } from './pages/Registro';
import { Favoritos } from './pages/Favoritos';
import { MisInmuebles } from './pages/MisInmuebles';
import { FormularioInmueble } from './pages/FormularioInmueble';
import { Recuperar } from './pages/Recuperar';
import { BusquedasGuardadas } from './pages/BusquedasGuardadas';
import { CambiarClave } from './pages/CambiarClave';
import { ConfirmarCorreo } from './pages/ConfirmarCorreo';
import { AvisoCorreoSinConfirmar } from './components/AvisoCorreoSinConfirmar';
import { Comparar } from './pages/Comparar';
import { Roomies } from './pages/Roomies';
import { MapaDePrecios } from './pages/MapaDePrecios';
import { MiPerfilRoomie } from './pages/MiPerfilRoomie';
import { BarraComparador } from './components/BarraComparador';
import { Admin } from './pages/Admin';
import { NoEncontrado } from './pages/NoEncontrado';

export function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Encabezado />
      <AvisoCorreoSinConfirmar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Buscar />} />
          <Route path="/inmueble/:id" element={<DetalleInmueble />} />
          <Route path="/comparar" element={<Comparar />} />
          <Route path="/roomies" element={<Roomies />} />
          <Route path="/mapa-de-precios" element={<MapaDePrecios />} />
          <Route
            path="/roomies/mi-perfil"
            element={
              <RutaProtegida>
                <MiPerfilRoomie />
              </RutaProtegida>
            }
          />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar" element={<Recuperar />} />
          <Route path="/cambiar-clave" element={<CambiarClave />} />
          <Route path="/confirmar-correo" element={<ConfirmarCorreo />} />

          <Route
            path="/favoritos"
            element={
              <RutaProtegida>
                <Favoritos />
              </RutaProtegida>
            }
          />
          <Route
            path="/busquedas"
            element={
              <RutaProtegida>
                <BusquedasGuardadas />
              </RutaProtegida>
            }
          />
          <Route
            path="/mis-inmuebles"
            element={
              <RutaProtegida roles={['ARRENDADOR', 'ADMIN']}>
                <MisInmuebles />
              </RutaProtegida>
            }
          />
          <Route
            path="/publicar"
            element={
              <RutaProtegida roles={['ARRENDADOR', 'ADMIN']}>
                <FormularioInmueble />
              </RutaProtegida>
            }
          />
          <Route
            path="/inmueble/:id/editar"
            element={
              <RutaProtegida roles={['ARRENDADOR', 'ADMIN']}>
                <FormularioInmueble />
              </RutaProtegida>
            }
          />

          <Route
            path="/admin"
            element={
              <RutaProtegida roles={['ADMIN']}>
                <Admin />
              </RutaProtegida>
            }
          />

          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </main>

      <BarraComparador />
      <PiePagina />
    </div>
  );
}
