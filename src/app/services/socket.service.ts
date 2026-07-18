// services/socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
    private socket: Socket;

    constructor() {
        this.socket = io('http://localhost:8087', {
            transports: ['websocket'],
            autoConnect: true
        });
    }

    // Écouter les nouvelles demandes d'adhésion
    onNewJoinRequest(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('new_join_request', (data) => {
                observer.next(data);
            });
        });
    }

    // Écouter les acceptations de demande
    onRequestAccepted(): Observable<any> {
        return new Observable(observer => {
            this.socket.on('request_accepted', (data) => {
                observer.next(data);
            });
        });
    }

    // Déconnexion
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}