
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, FlatList,
  ActivityIndicator, Alert, StyleSheet, ScrollView,
  Pressable, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';


const API_URL = Constants.expoConfig?.extra?.apiUrl;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export default function App() {
  const [pantalla, setPantalla] = useState('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolRegistro, setRolRegistro] = useState('cliente');
  const [rol, setRol] = useState('');
  const [nombrePerfil, setNombrePerfil] = useState('');
  const [emailUsuario, setEmailUsuario] = useState('');
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

  useEffect(() => {
    async function configurarNotificaciones() {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Recordatorios',
          importance: Notifications.AndroidImportance.MAX
        });

        const { status: estadoActual } =
          await Notifications.getPermissionsAsync();

        if (estadoActual !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      } catch (error) {
        console.log('Error al configurar notificaciones:', error);
      }
    }

    configurarNotificaciones();
  }, []);

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
      setNombrePerfil(datos.usuario.nombre);
      setEmailUsuario(datos.usuario.email);
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

    async function programarNotificacionReserva(reserva) {
    try {
      const fechaHoraReserva = new Date(
        `${reserva.fecha.slice(0, 10)}T${reserva.hora}:00`
      );

      const fechaRecordatorio = new Date(
        fechaHoraReserva.getTime() - 24 * 60 * 60 * 1000
      );

      if (fechaRecordatorio <= new Date()) {
        return;
      }

      const idNotificacion = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de reserva',
          body: `En 24 horas tienes una reserva para ${reserva.servicio.nombre}.`,
          data: {
            reservaId: reserva.id
          }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fechaRecordatorio
        }
      });

      const guardadas = await AsyncStorage.getItem('notificacionesReservas');
      const notificaciones = guardadas ? JSON.parse(guardadas) : {};

      notificaciones[String(reserva.id)] = idNotificacion;

      await AsyncStorage.setItem(
        'notificacionesReservas',
        JSON.stringify(notificaciones)
      );

      console.log('Notificación programada:', idNotificacion);
    } catch (error) {
      console.log('Error al programar notificación:', error);
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
      await programarNotificacionReserva(datos.reserva);

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

  async function cancelarNotificacionReserva(reservaId) {
    try {
      const guardadas = await AsyncStorage.getItem('notificacionesReservas');
      const notificaciones = guardadas ? JSON.parse(guardadas) : {};

      const idNotificacion = notificaciones[String(reservaId)];

      if (idNotificacion) {
        await Notifications.cancelScheduledNotificationAsync(idNotificacion);

        delete notificaciones[String(reservaId)];

        await AsyncStorage.setItem(
          'notificacionesReservas',
          JSON.stringify(notificaciones)
        );
      }
    } catch (error) {
      console.log('Error al cancelar notificación:', error);
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

      await cancelarNotificacionReserva(id);

      Alert.alert('Éxito', 'Reserva cancelada correctamente');
      await cargarReservas();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
async function guardarPerfil() {
    if (!nombrePerfil.trim()) {
      Alert.alert('Atención', 'Ingresa tu nombre');
      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(`${API_URL}/usuarios/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nombrePerfil.trim()
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo actualizar el perfil');
      }

      setNombrePerfil(datos.usuario.nombre);
      Alert.alert('Correcto', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
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
      <ScrollView contentContainerStyle={styles.loginFondo}>
        <StatusBar barStyle="light-content" backgroundColor="#102A43" />

        <View style={styles.loginEncabezado}>
          <View style={styles.loginIcono}>
            <Text style={styles.loginIconoTexto}>SR</Text>
          </View>

          <Text style={styles.loginTitulo}>Sistema de Reservas</Text>
          <Text style={styles.loginSubtitulo}>
            Gestiona tus servicios y reservas fácilmente
          </Text>
        </View>

        <View style={styles.loginTarjeta}>
          <Text style={styles.loginBienvenida}>¡Bienvenido!</Text>
          <Text style={styles.loginDescripcion}>
            Inicia sesión para continuar
          </Text>

          <Text style={styles.loginEtiqueta}>Correo electrónico</Text>
          <TextInput
            style={styles.loginInput}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.loginEtiqueta}>Contraseña</Text>
          <TextInput
            style={styles.loginInput}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            style={styles.loginBoton}
            onPress={iniciarSesion}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBotonTexto}>Iniciar sesión</Text>
            )}
          </Pressable>

          <View style={styles.loginRegistro}>
            <Text style={styles.loginTextoRegistro}>
              ¿No tienes una cuenta?
            </Text>

            <Pressable onPress={() => setPantalla('registro')}>
              <Text style={styles.loginEnlace}>Crear cuenta</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.loginPie}>
          Sistema de Reservas © 2026
        </Text>
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

  if (pantalla === 'perfil') {
    return (
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Text style={styles.titulo}>Mi perfil</Text>

        <Text style={styles.etiqueta}>Correo electrónico</Text>
        <Text style={styles.nombre}>{emailUsuario}</Text>

        <Text style={styles.etiqueta}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          value={nombrePerfil}
          onChangeText={setNombrePerfil}
        />

        {cargando ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button
            title="Guardar cambios"
            onPress={guardarPerfil}
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

    <View style={styles.separacion}>
      <Button
        title="Mi perfil"
        onPress={() => setPantalla('perfil')}
      />
    </View>

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

    <Button
      title="Cerrar sesión"
      onPress={cerrarSesion}
    />
  </View>
);
}

const styles = StyleSheet.create({
  loginFondo: {
    flexGrow: 1,
    backgroundColor: '#102A43',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 55,
    paddingBottom: 30
  },
  loginEncabezado: {
    alignItems: 'center',
    marginBottom: 35
  },
  loginIcono: {
    width: 75,
    height: 75,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18
  },
  loginIconoTexto: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#1769AA'
  },
  loginTitulo: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center'
  },
  loginSubtitulo: {
    color: '#D5E3F0',
    fontSize: 14,
    marginTop: 9,
    textAlign: 'center'
  },
  loginTarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    elevation: 5
  },
  loginBienvenida: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#17365D',
    marginBottom: 7
  },
  loginDescripcion: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 25
  },
  loginEtiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8
  },
  loginInput: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#DCE5EF',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: '#243247',
    marginBottom: 19
  },
  loginBoton: {
    backgroundColor: '#1769AA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  loginBotonTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loginRegistro: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 24,
    gap: 5
  },
  loginTextoRegistro: {
    color: '#64748B',
    fontSize: 14
  },
  loginEnlace: {
    color: '#1769AA',
    fontWeight: 'bold',
    fontSize: 14
  },
  loginPie: {
    color: '#D5E3F0',
    textAlign: 'center',
    marginTop: 28,
    fontSize: 12
  },
  contenedor: {
    flex: 1,
    padding: 22,
    paddingTop: 55,
    paddingBottom: 30,
    backgroundColor: '#F1F5F9'
  },

  titulo: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#17365D',
    marginBottom: 22,
    textAlign: 'center'
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5EF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 15,
    fontSize: 16,
    color: '#243247'
  },

  servicio: {
    padding: 20,
    marginVertical: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E7F0',
    borderRadius: 18,
    shadowColor: '#17365D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },

  nombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#17365D',
    marginBottom: 10
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
