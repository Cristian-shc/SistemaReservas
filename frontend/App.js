
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, FlatList,
  ActivityIndicator, Alert, StyleSheet, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export default function App() {
  const [pantalla, setPantalla] = useState('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolRegistro, setRolRegistro] = useState('cliente');
  const [rol, setRol] = useState('');
  const [token, setToken] = useState('');
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [reservas, setReservas] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [fechaReserva, setFechaReserva] = useState('');
  const [horaReserva, setHoraReserva] = useState('');
  const [nombreServicio, setNombreServicio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [duracion, setDuracion] = useState('30');
  const [precio, setPrecio] = useState('');

  async function registrar() {
    if (!nombre.trim() || !email.trim() || !password) {
      Alert.alert('Atención', 'Completa todos los campos');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          rol: rolRegistro
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo registrar');
      }

      Alert.alert('Correcto', 'Cuenta creada. Ahora puedes iniciar sesión.');
      setEmail(email.trim());
      setPassword('');
      setNombre('');
      setPantalla('login');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo conectar con la API');
    } finally {
      setCargando(false);
    }
  }

  async function iniciarSesion() {
    if (!email.trim() || !password) {
      Alert.alert('Atención', 'Completa el correo y la contraseña');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo iniciar sesión');
      }

      await AsyncStorage.setItem('token', datos.token);
      setToken(datos.token);
      setRol(datos.usuario.rol);
      await cargarServicios(datos.token);
      setPantalla('servicios');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo conectar con la API');
    } finally {
      setCargando(false);
    }
  }

  async function cargarServicios(jwt = token) {
    const respuesta = await fetch(`${API_URL}/servicios`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });

    const datos = await respuesta.json();

    if (respuesta.status === 401) {
      await AsyncStorage.removeItem('token');
      setToken('');
      setRol('');
      setPantalla('login');
      throw new Error('La sesión venció. Inicia sesión otra vez.');
    }

    if (!respuesta.ok) {
      throw new Error(datos.error || 'No se pudieron consultar los servicios');
    }

    setServicios(datos);
  }

  async function crearServicio() {
    if (!nombreServicio.trim() || !descripcion.trim() ||
        !duracion.trim() || !precio.trim()) {
      Alert.alert('Atención', 'Completa todos los campos del servicio');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}/servicios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nombreServicio.trim(),
          descripcion: descripcion.trim(),
          duracion: Number(duracion),
          precio: Number(precio)
        })
      });

      const datos = await respuesta.json();

      if (respuesta.status === 401) {
        await AsyncStorage.removeItem('token');
        setToken('');
        setRol('');
        setPantalla('login');
        throw new Error('La sesión venció. Inicia sesión otra vez.');
      }

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo crear el servicio');
      }

      setNombreServicio('');
      setDescripcion('');
      setDuracion('30');
      setPrecio('');
      await cargarServicios();
      setPantalla('servicios');
      Alert.alert('Correcto', 'Servicio creado correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo conectar con la API');
    } finally {
      setCargando(false);
    }
  }



  
  async function cargarReservas() {
    try {
      const respuesta = await fetch(`${API_URL}/reservas/mis-reservas`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudieron cargar las reservas');
      }

      setReservas(datos);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function cargarTodasLasReservas() {
    try {
      const respuesta = await fetch(`${API_URL}/reservas`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudieron cargar las reservas');
      }

      setReservas(datos);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }


  async function crearReserva() {
    if (!fechaReserva || !horaReserva) {
      Alert.alert('Atención', 'Ingresa la fecha y la hora de la reserva');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaReserva)) {
      Alert.alert('Fecha incorrecta', 'Usa el formato AAAA-MM-DD. Ejemplo: 2026-11-05');
      return;
    }

    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horaReserva)) {
      Alert.alert('Hora incorrecta', 'Usa el formato HH:MM. Ejemplo: 14:30');
      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(`${API_URL}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          servicioId: servicioSeleccionado.id,
          fecha: fechaReserva,
          hora: horaReserva
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo crear la reserva');
      }

      Alert.alert('Éxito', 'Tu reserva se creó correctamente');
      setFechaReserva('');
      setHoraReserva('');
      setPantalla('servicios');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  }

  
  async function completarReserva(id) {
    try {
      const respuesta = await fetch(`${API_URL}/reservas/${id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: 'completada'
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo completar la reserva');
      }

      Alert.alert('Éxito', 'Reserva marcada como completada');
      await cargarTodasLasReservas();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function cancelarReserva(id) {
    try {
      const respuesta = await fetch(`${API_URL}/reservas/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo cancelar la reserva');
      }

      Alert.alert('Éxito', 'Reserva cancelada correctamente');
      await cargarReservas();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function cerrarSesion() {
    await AsyncStorage.removeItem('token');
    setToken('');
    setRol('');
    setPassword('');
    setPantalla('login');
  }

  function campo(placeholder, valor, cambiar, opciones = {}) {
    return (
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={valor}
        onChangeText={cambiar}
        {...opciones}
      />
    );
  }

  if (pantalla === 'login') {
    return (
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Text style={styles.titulo}>Sistema de Reservas</Text>
        {campo('Correo electrónico', email, setEmail, {
          keyboardType: 'email-address',
          autoCapitalize: 'none'
        })}
        {campo('Contraseña', password, setPassword, {
          secureTextEntry: true
        })}

        {cargando ? <ActivityIndicator size="large" /> :
          <Button title="Iniciar sesión" onPress={iniciarSesion} />}

        <View style={styles.separacion} />
        <Button
          title="Crear cuenta"
          onPress={() => setPantalla('registro')}
        />
      </ScrollView>
    );
  }
  
  if (pantalla === 'nuevaReserva') {
    return (
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Text style={styles.titulo}>Reservar servicio</Text>

        <Text style={styles.nombre}>
          {servicioSeleccionado?.nombre}
        </Text>

        <Text style={styles.etiqueta}>
          Duración: {servicioSeleccionado?.duracion} minutos
        </Text>

        <Text style={styles.etiqueta}>
          Precio: RD$ {servicioSeleccionado?.precio}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Fecha (AAAA-MM-DD)"
          value={fechaReserva}
          onChangeText={setFechaReserva}
        />

        <TextInput
          style={styles.input}
          placeholder="Hora (HH:MM, ejemplo 14:30)"
          value={horaReserva}
          onChangeText={setHoraReserva}
        />

        {cargando ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button
            title="Confirmar reserva"
            onPress={crearReserva}
          />
        )}

        <View style={styles.separacion} />

        <Button
          title="Volver a servicios"
          onPress={() => setPantalla('servicios')}
        />
      </ScrollView>
    );
  }


  if (pantalla === 'misReservas') {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Mis reservas</Text>

        <FlatList
          style={styles.lista}
          data={reservas}
          keyExtractor={item => String(item.id)}
          ListEmptyComponent={
            <Text>No tienes reservas registradas.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.servicio}>
              <Text style={styles.nombre}>
                {item.servicio?.nombre || 'Servicio'}
              </Text>

              <Text>
                Fecha: {new Date(item.fecha).toLocaleDateString()}
              </Text>

              <Text>Hora: {item.hora}</Text>

              <Text>Estado: {item.estado}</Text>

              {item.estado === 'pendiente' && (
                <View style={styles.separacion}>
                  <Button
                    title="Cancelar reserva"
                    onPress={() => {
                      Alert.alert(
                        'Cancelar reserva',
                        '¿Seguro que deseas cancelar esta reserva?',
                        [
                          {
                            text: 'No',
                            style: 'cancel'
                          },
                          {
                            text: 'Sí, cancelar',
                            onPress: () => cancelarReserva(item.id)
                          }
                        ]
                      );
                    }}
                  />
                </View>
              )}
            </View>
          )}
        />

        <Button
          title="Volver a servicios"
          onPress={() => setPantalla('servicios')}
        />
      </View>
    );
  }

  
  if (pantalla === 'todasReservas') {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Todas las reservas</Text>

        <FlatList
          style={styles.lista}
          data={reservas}
          keyExtractor={item => String(item.id)}
          ListEmptyComponent={
            <Text>No hay reservas registradas.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.servicio}>
              <Text style={styles.nombre}>
                {item.servicio?.nombre || 'Servicio'}
              </Text>

              <Text>
                Cliente: {item.usuario?.nombre || 'No disponible'}
              </Text>

              <Text>
                Fecha: {new Date(item.fecha).toLocaleDateString()}
              </Text>

              <Text>Hora: {item.hora}</Text>
              <Text>Estado: {item.estado}</Text>

              {item.estado === 'pendiente' && (
                <View style={styles.separacion}>
                  <Button
                    title="Marcar como completada"
                    onPress={() => completarReserva(item.id)}
                  />
                </View>
              )}
            </View>
          )}
        />

        <Button
          title="Volver a servicios"
          onPress={() => setPantalla('servicios')}
        />
      </View>
    );
  }

  if (pantalla === 'registro') {
    return (
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Text style={styles.titulo}>Crear cuenta</Text>
        {campo('Nombre completo', nombre, setNombre)}
        {campo('Correo electrónico', email, setEmail, {
          keyboardType: 'email-address',
          autoCapitalize: 'none'
        })}
        {campo('Contraseña', password, setPassword, {
          secureTextEntry: true
        })}

        <Text style={styles.etiqueta}>Tipo de cuenta</Text>
        <View style={styles.separacion}>
          <Button
            title="Cliente"
            onPress={() => setRolRegistro('cliente')}
            color={rolRegistro === 'cliente' ? '#1769aa' : '#888'}
          />
        </View>
        <View style={styles.separacion}>
          <Button
            title="Administrador"
            onPress={() => setRolRegistro('admin')}
            color={rolRegistro === 'admin' ? '#1769aa' : '#888'}
          />
        </View>

        <View style={styles.separacion}>
          {cargando ? <ActivityIndicator size="large" /> :
            <Button title="Registrarme" onPress={registrar} />}
        </View>
        <Button
          title="Volver al inicio de sesión"
          onPress={() => setPantalla('login')}
        />
      </ScrollView>
    );
  }

  if (pantalla === 'crearServicio') {
    return (
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Text style={styles.titulo}>Crear servicio</Text>
        {campo('Nombre del servicio', nombreServicio, setNombreServicio)}
        {campo('Descripción', descripcion, setDescripcion)}
        {campo('Duración en minutos', duracion, setDuracion, {
          keyboardType: 'numeric'
        })}
        {campo('Precio en RD$', precio, setPrecio, {
          keyboardType: 'decimal-pad'
        })}

        {cargando ? <ActivityIndicator size="large" /> :
          <Button title="Guardar servicio" onPress={crearServicio} />}
        <View style={styles.separacion} />
        <Button
          title="Volver a servicios"
          onPress={() => setPantalla('servicios')}
        />
      </ScrollView>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Servicios disponibles</Text>
      <Text style={styles.etiqueta}>
        Sesión: {rol === 'admin' ? 'Administrador' : 'Cliente'}
      </Text>

  {rol !== 'admin' && (
  <View style={styles.separacion}>
    <Button
      title="Mis reservas"
      onPress={async () => {
        await cargarReservas();
        setPantalla('misReservas');
      }}
    />
  </View>
  )}

      {rol === 'admin' && (
        <View style={styles.separacion}>
          <Button
            title="Todas las reservas"
            onPress={async () => {
              await cargarTodasLasReservas();
              setPantalla('todasReservas');
            }}
          />
        </View>
      )}


      <View style={styles.separacion}>
        <Button
          title="Actualizar servicios"
          onPress={() => cargarServicios().catch(error =>
            Alert.alert('Error', error.message)
          )}
        />
      </View>

      {rol === 'admin' && (
        <View style={styles.separacion}>
          <Button
            title="Crear servicio"
            onPress={() => setPantalla('crearServicio')}
          />
        </View>
      )}

      <FlatList
        style={styles.lista}
        data={servicios}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text>No hay servicios registrados.</Text>
        }
        
renderItem={({ item }) => (
  <View style={styles.servicio}>
    <Text style={styles.nombre}>{item.nombre}</Text>
    <Text>{item.descripcion}</Text>
    <Text>Duración: {item.duracion} minutos</Text>
    <Text>Precio: RD$ {item.precio}</Text>

    {rol !== 'admin' && (
      <View style={styles.separacion}>
        <Button
          title="Reservar servicio"
          onPress={() => {
            setServicioSeleccionado(item);
            setFechaReserva('');
            setHoraReserva('');
            setPantalla('nuevaReserva');
          }}
        />
      </View>
    )}
  </View>
)}

      />
      <Button title="Cerrar sesión" onPress={cerrarSesion} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    padding: 22,
    paddingTop: 60,
    paddingBottom: 35,
    backgroundColor: '#F3F6FB'
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#17365D',
    marginBottom: 24,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DEEA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 15,
    fontSize: 16,
    color: '#243247'
  },
  servicio: {
    padding: 18,
    marginVertical: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E7F0',
    borderRadius: 16,
    shadowColor: '#17365D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  nombre: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#17365D',
    marginBottom: 8
  },
  etiqueta: {
    fontSize: 16,
    color: '#52647A',
    marginBottom: 14,
    textAlign: 'center'
  },
  separacion: {
    marginVertical: 8
  },
  lista: {
    flex: 1
  }
});
